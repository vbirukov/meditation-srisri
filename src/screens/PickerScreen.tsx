import { Navigate, useSearchParams } from 'react-router-dom';

export function PickerScreen() {
  const [params] = useSearchParams();
  const tab = params.get('tab');
  const to = tab ? `/practice?tab=${tab}` : '/practice';
  return <Navigate to={to} replace />;
}
