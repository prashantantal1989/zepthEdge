import { Building } from 'lucide-react';

interface LogoProps {
  size?: 'small' | 'normal' | 'large';
}

const Logo = ({ size = 'normal' }: LogoProps) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    normal: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  return (
    <div className={`bg-gradient-to-br from-pastel-peach to-pastel-mauve text-white rounded-md flex items-center justify-center ${sizeClasses[size]}`}>
      <Building size={size === 'small' ? 16 : size === 'normal' ? 20 : 24} />
    </div>
  );
};

export default Logo;