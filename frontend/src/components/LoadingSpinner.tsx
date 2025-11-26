import { Loader2 } from 'lucide-react';
import { COLORS } from '../utils/constants';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
        <Loader2 className={`w-8 h-8 animate-spin text-[${COLORS.PRIMARY}]`} />
        <p className="ml-2 text-lg text-[#383a42]">Yükleniyor...</p>
    </div>
);

export default LoadingSpinner;