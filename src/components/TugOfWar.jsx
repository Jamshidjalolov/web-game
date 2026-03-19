import React from "react";
import arqon from "../assets/arqon.png";

export default function TugOfWar() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black overflow-hidden">
      <img
        src={arqon}
        alt="arqon tortish"
        className="w-[900px] tug-animation"
      />
    </div>
  );
}
