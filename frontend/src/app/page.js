"use client";

import { redirect, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import CheckBox from "@/components/CheckBox";
import DropZone from "@/components/DropZone";
import { BiSelectMultiple } from "react-icons/bi";
import { VscClearAll } from "react-icons/vsc";
import {
  FaFileAlt,
  FaFileUpload,
  FaRegFileAlt,
  FaSearch,
} from "react-icons/fa";
import { IoMdDownload } from "react-icons/io";

export default function Home() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const fileInputRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [filename, setFilename] = useState("");
  const [filtered, setFiltered] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractLogOptions = (file) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
      const csvText = event.target.result;

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data;
          if (data.length === 0 || !data[0].Collar) {
            alert("Invalid CSV file format");
            return;
          }

          // Group collars
          let group = 0;
          let lastCollar = null;
          const groups = {};

          data.forEach((row) => {
            if (row.Collar !== lastCollar) {
              group++;
            }
            lastCollar = row.Collar;
            if (!groups[group]) {
              groups[group] = [];
            }
            //console.log(row.Sample_Mass > 0);

            groups[group].push(row);
          });

          // Filter groups where the first row's sample mass > 0
          const filteredGroups = Object.values(groups).filter(
            (group) => parseFloat(group[0].Sample_Mass) > 0,
          );

          // Extract first 'Collar' from each group
          //const logOptionsList = Object.values(groups).map((group) => group[0].Collar);

          const logOptionsList = filteredGroups.map((group) => group[0].Collar);
          setLogs(logOptionsList);
        },
      });
    };
  };

  const handleCheckboxChange = (log) => {
    setCheckedItems(
      (prevLogs) =>
        prevLogs.includes(log)
          ? prevLogs.filter((item) => item !== log) // Remove if unchecked
          : [...prevLogs, log], // Add if checked
    );
  };

  {
    /* Handle file change */
  }

  useEffect(() => {
    if (file) {
      extractLogOptions(file);
    } else {
      setLogs([]);
      setCheckedItems([]);
    }
  }, [file]);

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    if (!file) {
      alert("Please select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    checkedItems.forEach((log) => {
      formData.append("checkedItems", log);
    });

    setFilename(file.name.split(".")[0]);

    console.log([...formData]);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      // Create a Blob URL for the downloaded file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      // Clear the file input after report is processed
      setFile(null);
      setCheckedItems([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the input field
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    setDownloadUrl("");
    window.location.reload();
  };

  const filterdLogs = logs.filter((log) =>
    log.toLowerCase().includes(filtered.toLowerCase()),
  );

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    else return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  return (
    <>
      {/* Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
          <svg
            className="animate-spin h-8 w-8 text-white mr-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-white text-lg font-semibold">
            Processing...
          </span>
        </div>
      )}

      <div className="flex flex-col gap-y-10 min-h-screen justify-center items-center mx-auto bg-slate-100">
        <h1 className="m-4 text-lg md:text-3xl font-bold">
          Upload File for Analysis
        </h1>
        {/* Upload and file section */}
        <div className="flex w-full md:w-2/3 lg:w-1/3 flex-col rounded-md border bg-white p-4 shadow-md">
          <form onSubmit={handleSubmit} className="">
            <label htmlFor="file-upload" className="block cursor-pointer">
              <DropZone file={file} setFile={setFile} />
            </label>

            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-100 border border-dashed mx-auto rounded-md w-full p-5 m-5">
              {/* File info */}
              <div className="flex items-center gap-2 min-w-0">
                <FaRegFileAlt className="shrink-0" />

                <div className="text-sm text-gray-700 min-w-0">
                  {file ? (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span className="truncate max-w-full sm:max-w-xs">
                        {file.name}
                      </span>
                      <span className="text-slate-400 whitespace-nowrap">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">No file selected</span>
                  )}
                </div>
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full md:w-auto bg-slate-500 text-white px-4 py-2 rounded-md hover:cursor-pointer"
              >
                Upload and Process
              </button>
            </div>
          </form>
          {downloadUrl && (
            <div className="text-xl font-thin">
              <h2>Download your processed report:</h2>
              <div className="flex justify-between border rounded-md bg-slate-100 p-5 text-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-md bg-slate-50 p-3">
                    <FaFileAlt className="text-green-500" />
                  </div>
                  <span className="truncate font-medium">{filename}.html</span>
                </div>
                <a
                  className="flex items-center gap-2 font-bold text-blue-500 hover:underline"
                  href={downloadUrl}
                  download={`${filename}.html`}
                  onClick={() => setDownloadUrl("")}
                >
                  <span>Download</span>
                  <IoMdDownload className="text-lg" />
                </a>
              </div>
            </div>
          )}
        </div>
        {/* Logs selection section */}
        {file && (
          <div className="flex w-full md:w-2/3 lg:w-1/3 border border-solid rounded-md bg-white  shadow-md">
            {logs.length > 0 && (
              <div className="w-full">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-5 px-3 pb-6 w-full">
                  <h2 className="text-lg sm:text-xl font-bold">
                    Select logs for analysis
                  </h2>

                  <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-100"
                      type="text"
                      placeholder="Filter logs..."
                      value={filtered}
                      onChange={(e) => setFiltered(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-x-6 border-t border-b  bg-slate-100 w-full p-4">
                  <div
                    className="flex gap-x-2 hover:text-blue-500 hover:cursor-pointer"
                    onClick={() => setCheckedItems(logs)}
                  >
                    <h2>Select All</h2>
                    <BiSelectMultiple size={25} />
                  </div>
                  <div
                    className="flex gap-x-2 hover:text-blue-500 hover:cursor-pointer"
                    onClick={() => setCheckedItems([])}
                  >
                    <h2>Clear All</h2>
                    <VscClearAll size={25} />
                  </div>
                </div>

                <div className="max-h-54 overflow-y-auto border-b px-4 sm:px-8 min-h-8">
                  {filterdLogs.map((log) => (
                    <div key={log} className="flex items-center gap-x-3 p-1">
                      <CheckBox
                        log={log}
                        checkedItems={checkedItems}
                        handleCheckBoxChange={() => handleCheckboxChange(log)}
                      />
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="flex justify-end p-4">
                  <p
                    className="p-2 text-base sm:text-lg cursor-pointer hover:text-blue-500 hover:underline"
                    onClick={() => setFiles([])}
                  >
                    Cancel
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        <footer className="p-5 w-full sticky bottom-0 bg-slate-100">
          <p className="text-center text-slate-400 font-extralight text-sm">
            &copy; 2024 Your Company. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}
