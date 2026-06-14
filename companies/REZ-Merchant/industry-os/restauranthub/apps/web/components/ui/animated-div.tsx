import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

// Predefined animation variants
const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    exit: { opacity: 0, scale: 0.3 },
  },
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  staggerChild: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
}

type AnimationVariant = keyof typeof animationVariants

interface AnimatedDivProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  variant?: AnimationVariant
  duration?: number
  delay?: number
  stagger?: boolean
  children: React.ReactNode
}

const AnimatedDiv = React.forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({
    variant = 'fadeIn',
    duration = 0.3,
    delay = 0,
    stagger = false,
    className,
    children,
    ...props
  }, ref) => {
    const variants = animationVariants[variant]

    const transition = {
      duration,
      delay,
      ease: "easeOut",
    }

    if (stagger && variant === 'staggerContainer') {
      return (
        <motion.div
          ref={ref}
          className={className}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          {...props}
        >
          {React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              variants={animationVariants.staggerChild}
              transition={{ ...transition, delay: delay + (index * 0.1) }}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedDiv.displayName = 'AnimatedDiv'

// Utility component for smooth page transitions
interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => (
  <motion.div
    className={cn('min-h-screen', className)}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)

// Component for animating list items
interface AnimatedListProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className,
  delay = 0
}) => (
  <motion.div
    className={className}
    variants={animationVariants.staggerContainer}
    initial="initial"
    animate="animate"
    transition={{ delay }}
  >
    {React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        variants={animationVariants.staggerChild}
        transition={{ delay: index * 0.1 }}
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
)

// Hover animation wrapper
interface HoverAnimatedProps {
  children: React.ReactNode
  className?: string
  scale?: number
  y?: number
}

const HoverAnimated: React.FC<HoverAnimatedProps> = ({
  children,
  className,
  scale = 1.05,
  y = -2
}) => (
  <motion.div
    className={className}
    whileHover={{ scale, y }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
  >
    {children}
  </motion.div>
)

export {
  AnimatedDiv,
  PageTransition,
  AnimatedList,
  HoverAnimated,
  animationVariants
}