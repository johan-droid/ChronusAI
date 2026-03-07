import { useAuthStore } from '../store/authStore';

export default function AuthDebug() {
  const { user, accessToken, refreshToken, isAuthenticated, isLoading } = useAuthStore();

  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user ? user.email : 'None'}</div>
        <div>Access Token: {accessToken ? 'Present' : 'None'}</div>
        <div>Refresh Token: {refreshToken ? 'Present' : 'None'}</div>
        <div>URL: {window.location.href}</div>
      </div>
      <button
        onClick={() => useAuthStore.getState().logout()}
        className="mt-2 px-2 py-1 bg-red-500 rounded text-xs"
      >
        Logout
      </button>
    </div>
  );
}
