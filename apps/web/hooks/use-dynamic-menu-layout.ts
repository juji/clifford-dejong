import { useEffect, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts'


export function useDynamicMenuLayout() {
  
  const big = useMediaQuery('(min-width: 1024px)');
  const [ menuType, setMenuType ] = useState<'normal' | 'small'>('small');

  useEffect(() => {
    if (big) {
      setMenuType('normal');
    } else {
      setMenuType('small');
    }
  }, [big]);

  return [menuType] as const;
}