const AnimatedAvatar = () => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto md:mx-0 shrink-0 group">
      <div className="absolute inset-0 border-2 border-black translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-300" />

      <div className="relative w-full h-full border-2 border-black bg-white overflow-hidden group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
        <img
          src="/images/avatar.png.png"
          alt="Abdelrahman Abozena"
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)",
          }}
        />
      </div>

      <div className="absolute -bottom-3 -right-3 bg-black text-white px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-black z-10">
        <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
        Available
      </div>
    </div>
  );
};

export default AnimatedAvatar;
