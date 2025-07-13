import { useEffect, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts'


export function useDynamicMenuLayout() {
  
  const big = useMediaQuery('(min-width: 1024px)');
  const smallHorizontal = useMediaQuery('(orientation: landscape) and (max-width: 1023px)');

  const [ menuType, setMenuType ] = useState<'normal' | 'bottom' | 'left'>('bottom');

  useEffect(() => {
    if (big) {
      setMenuType('normal');
    } else if (smallHorizontal) {
      setMenuType('left');
    } else {
      setMenuType('bottom');
    }
  }, [big, smallHorizontal]);

  return [menuType] as const;
}