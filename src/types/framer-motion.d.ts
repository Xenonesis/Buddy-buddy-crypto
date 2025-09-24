declare module 'framer-motion' {
  import { ComponentType, HTMLAttributes, ReactNode } from 'react';
  
  interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    variants?: any;
    children?: ReactNode;
  }
  
  interface MotionDivProps extends HTMLAttributes<HTMLDivElement>, MotionProps {}
  interface MotionButtonProps extends HTMLAttributes<HTMLButtonElement>, MotionProps {
    type?: string;
    disabled?: boolean;
  }
  interface MotionAsideProps extends HTMLAttributes<HTMLElement>, MotionProps {}
  interface MotionTrProps extends HTMLAttributes<HTMLTableRowElement>, MotionProps {}
  
  export const motion: {
    div: ComponentType<MotionDivProps>;
    button: ComponentType<MotionButtonProps>;
    aside: ComponentType<MotionAsideProps>;
    tr: ComponentType<MotionTrProps>;
  };
  
  export const AnimatePresence: ComponentType<{ children: ReactNode }>;
}