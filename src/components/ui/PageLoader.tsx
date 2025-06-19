import { motion } from 'framer-motion';
import Logo from './Logo';

const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pastel-peach bg-opacity-5">
      <div className="text-center">
        <motion.div
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto"
        >
          <Logo size="large" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-pastel-dusty text-lg"
        >
          Loading Zepth Edge...
        </motion.p>
      </div>
    </div>
  );
};

export default PageLoader;