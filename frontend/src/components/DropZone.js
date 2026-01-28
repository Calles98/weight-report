"use client";

import { useState } from "react";
import { FaFileUpload } from "react-icons/fa";

function Dropzone({ file, setFile }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center border-2 border-dashed bg-slate-100 rounded-md p-10 text-center transition ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
    >
      <div className="p-2 m-2 h-20 w-20 rounded-full bg-blue-100 cursor-pointer flex items-center justify-center">
        <FaFileUpload className="text-xl" />
      </div>
      {file ? (
        <h2 className="">{file.name}</h2>
      ) : (
        <h2 className="text-xl font-bold">Click to upload or drag and drop</h2>
      )}

      {console.log(file)}
    </div>
  );
}

export default Dropzone;
