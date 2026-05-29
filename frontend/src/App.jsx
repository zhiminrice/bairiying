import { AuthProvider } from './context/AuthContext.jsx';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/index.jsx';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
