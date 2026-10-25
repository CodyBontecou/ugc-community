// Keep decoration on the server without continuous JavaScript animation.
export function BackgroundBlobs() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-cream"
      style={{
        top: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-50 bg-gradient-to-br from-peach-200 to-coral -top-[200px] -right-[100px]"
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-50 bg-gradient-to-br from-lavender-soft to-lavender bottom-[20%] -left-[150px]"
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-50 bg-gradient-to-br from-rose to-peach-300 top-[50%] right-[10%]"
      />
    </div>
  );
}
