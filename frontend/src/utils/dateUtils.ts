import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale'; 

export const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    
    return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: tr       
    });
};