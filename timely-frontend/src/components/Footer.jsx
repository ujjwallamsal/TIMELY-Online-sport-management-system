export default function Footer() {
    return (
      <footer className="border-t mt-10">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between text-sm">
          <span>© {new Date().getFullYear()} Timely</span>
          <a className="underline" href="#">Help</a>
        </div>
      </footer>
    );
  }
  