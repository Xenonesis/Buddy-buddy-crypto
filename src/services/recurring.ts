import { RecurringPayment, Transaction } from '../types';
import NitroLiteService from './nitrolite';
import { addDays, addWeeks, addMonths, isBefore } from 'date-fns';

class RecurringPaymentService {
  private static instance: RecurringPaymentService;
  private nitroLiteService: NitroLiteService;
  private recurringPayments: RecurringPayment[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  static getInstance(): RecurringPaymentService {
    if (!RecurringPaymentService.instance) {
      RecurringPaymentService.instance = new RecurringPaymentService();
    }
    return RecurringPaymentService.instance;
  }

  constructor() {
    this.nitroLiteService = NitroLiteService.getInstance();
    this.loadStoredPayments();
    this.startProcessing();
  }

  // Create new recurring payment
  createRecurringPayment(
    to: string,
    amount: string,
    token: string,
    frequency: RecurringPayment['frequency'],
    totalPayments: number = 0 // 0 = infinite
  ): RecurringPayment {
    const payment: RecurringPayment = {
      id: this.generatePaymentId(),
      to,
      amount,
      token,
      frequency,
      nextPayment: this.calculateNextPayment(Date.now(), frequency),
      isActive: true,
      totalPayments,
      completedPayments: 0,
      createdAt: Date.now()
    };

    this.recurringPayments.push(payment);
    this.savePayments();
    
    return payment;
  }

  // Get all recurring payments
  getRecurringPayments(): RecurringPayment[] {
    return this.recurringPayments.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get active recurring payments
  getActivePayments(): RecurringPayment[] {
    return this.recurringPayments.filter(payment => payment.isActive);
  }

  // Get payment by ID
  getPaymentById(id: string): RecurringPayment | undefined {
    return this.recurringPayments.find(payment => payment.id === id);
  }

  // Update recurring payment
  updateRecurringPayment(id: string, updates: Partial<RecurringPayment>): boolean {
    const paymentIndex = this.recurringPayments.findIndex(p => p.id === id);
    if (paymentIndex === -1) return false;

    this.recurringPayments[paymentIndex] = {
      ...this.recurringPayments[paymentIndex],
      ...updates
    };

    this.savePayments();
    return true;
  }

  // Cancel recurring payment
  cancelRecurringPayment(id: string): boolean {
    return this.updateRecurringPayment(id, { isActive: false });
  }

  // Pause recurring payment
  pauseRecurringPayment(id: string): boolean {
    return this.updateRecurringPayment(id, { isActive: false });
  }

  // Resume recurring payment
  resumeRecurringPayment(id: string): boolean {
    const payment = this.getPaymentById(id);
    if (!payment) return false;

    // Recalculate next payment date
    const nextPayment = this.calculateNextPayment(Date.now(), payment.frequency);
    
    return this.updateRecurringPayment(id, { 
      isActive: true,
      nextPayment
    });
  }

  // Start automatic processing
  startProcessing(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(async () => {
      await this.processScheduledPayments();
    }, 60000); // Check every minute

    console.log('Recurring payment processing started');
  }

  // Stop automatic processing
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('Recurring payment processing stopped');
  }

  // Process scheduled payments
  private async processScheduledPayments(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const currentTime = Date.now();
      const duePayments = this.getActivePayments().filter(
        payment => payment.nextPayment <= currentTime
      );

      for (const payment of duePayments) {
        await this.executePayment(payment);
      }
    } catch (error) {
      console.error('Error processing scheduled payments:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Execute individual payment
  private async executePayment(payment: RecurringPayment): Promise<void> {
    try {
      // Check if payment should be completed
      if (payment.totalPayments > 0 && payment.completedPayments >= payment.totalPayments) {
        this.updateRecurringPayment(payment.id, { isActive: false });
        return;
      }

      // Execute gasless transaction
      const transaction = await this.nitroLiteService.executeGaslessTransfer(
        payment.to,
        payment.amount,
        payment.token === 'ETH' ? undefined : payment.token
      );

      // Update payment record
      const nextPayment = this.calculateNextPayment(Date.now(), payment.frequency);
      const completedPayments = payment.completedPayments + 1;
      
      this.updateRecurringPayment(payment.id, {
        nextPayment,
        completedPayments,
        isActive: payment.totalPayments === 0 || completedPayments < payment.totalPayments
      });

      console.log(`Recurring payment executed: ${payment.id}`, transaction);
    } catch (error) {
      console.error(`Failed to execute recurring payment ${payment.id}:`, error);
      
      // Optionally implement retry logic or notification system
      // For now, we'll reschedule for next period
      const nextPayment = this.calculateNextPayment(Date.now(), payment.frequency);
      this.updateRecurringPayment(payment.id, { nextPayment });
    }
  }

  // Calculate next payment date
  private calculateNextPayment(fromDate: number, frequency: RecurringPayment['frequency']): number {
    const date = new Date(fromDate);
    
    switch (frequency) {
      case 'daily':
        return addDays(date, 1).getTime();
      case 'weekly':
        return addWeeks(date, 1).getTime();
      case 'monthly':
        return addMonths(date, 1).getTime();
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
  }

  // Get upcoming payments (next 30 days)
  getUpcomingPayments(): Array<RecurringPayment & { daysUntil: number }> {
    const now = Date.now();
    const thirtyDaysFromNow = addDays(new Date(now), 30).getTime();

    return this.getActivePayments()
      .filter(payment => payment.nextPayment <= thirtyDaysFromNow)
      .map(payment => ({
        ...payment,
        daysUntil: Math.ceil((payment.nextPayment - now) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.nextPayment - b.nextPayment);
  }

  // Get payment statistics
  getPaymentStats(): {
    totalActive: number;
    totalCompleted: number;
    nextPaymentDue: number | null;
    totalAmountScheduled: string;
  } {
    const activePayments = this.getActivePayments();
    const totalActive = activePayments.length;
    const totalCompleted = this.recurringPayments.reduce(
      (sum, payment) => sum + payment.completedPayments, 0
    );
    
    const nextPayments = activePayments.map(p => p.nextPayment).sort();
    const nextPaymentDue = nextPayments.length > 0 ? nextPayments[0] : null;

    // Calculate total amount scheduled for next month
    const nextMonth = addMonths(new Date(), 1).getTime();
    const totalAmountScheduled = activePayments
      .filter(payment => payment.nextPayment <= nextMonth)
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    return {
      totalActive,
      totalCompleted,
      nextPaymentDue,
      totalAmountScheduled: totalAmountScheduled.toFixed(6)
    };
  }

  // Private helper methods
  private loadStoredPayments(): void {
    try {
      const stored = localStorage.getItem('budget_buddy_recurring_payments');
      if (stored) {
        this.recurringPayments = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored recurring payments:', error);
    }
  }

  private savePayments(): void {
    try {
      localStorage.setItem('budget_buddy_recurring_payments', JSON.stringify(this.recurringPayments));
    } catch (error) {
      console.error('Error saving recurring payments:', error);
    }
  }

  private generatePaymentId(): string {
    return 'rp_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Clear all payments (for testing/reset)
  clearPayments(): void {
    this.recurringPayments = [];
    this.savePayments();
  }
}

export default RecurringPaymentService;