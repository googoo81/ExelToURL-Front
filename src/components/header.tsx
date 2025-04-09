"use client";

import { useRouter } from "next/navigation";

export default function Header() {
  const { push } = useRouter();

  return (
    <header className="bg-gray-800 text-white px-8 py-4 flex justify-between items-center shadow-md fixed w-full top-0">
      <div className="flex gap-4">
        <span
          onClick={() => push("/")}
          className="cursor-pointer hover:text-gray-300 transition"
        >
          홈
        </span>
        <span
          onClick={() => push("/origin")}
          className="cursor-pointer hover:text-gray-300 transition"
        >
          오리진
        </span>
        <span
          onClick={() => push("/url")}
          className="cursor-pointer hover:text-gray-300 transition"
        >
          링크만
        </span>
      </div>
    </header>
  );
}
