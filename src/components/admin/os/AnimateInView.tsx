import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimateInViewProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  once?: boolean;
}

const getDirectionProps = (direction: string) => {
  switch (direction) {
    case "up":
      return { y: 20, x: 0 };
    case "down":
      return { y: -20, x: 0 };
    case "left":
      return { x: 20, y: 0 };
    case "right":
      return { x: -20, y: 0 };
    default:
      return { y: 20, x: 0 };
  }
};

const AnimateInView: React.FC<AnimateInViewProps> = ({
  children,
  delay = 0,
  direction = "up",
  className = "",
  once = true,
}) => {
  const directionProps = getDirectionProps(direction);

  return (
    <motion.div
      initial={{ opacity: 0, ...directionProps }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimateInView;
