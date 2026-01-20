"use client";

import { redirect, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Papa from "papaparse";
import CheckBox from "@/components/CheckBox";
import { BiSelectMultiple } from "react-icons/bi";
import { VscClearAll } from "react-icons/vsc";
import { FaFileUpload, FaRegFileAlt, FaSearch } from "react-icons/fa";

export default function Home() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const fileInputRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [filename, setFilename] = useState("");
  const [filtered, setFiltered] = useState("");

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile); // Correctly updates the state
    extractLogOptions(selectedFile); // Use the selectedFile directly
  };

  const handleSubmit = async (e) => {
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
    <div className="flex flex-col gap-y-10 min-h-screen justify-center items-center mx-auto bg-slate-100">
      <h1 className="m-4 text-lg md:text-3xl font-bold">
        Upload File for Analysis
      </h1>
      {/* Upload and file section */}
      <div className="border-1 border-solid border-black rounded-md bg-white w-2/3 shadow-lg p-10">
        <form onSubmit={handleSubmit} className="">
          <div className="bg-slate-100 border-1 border-dashed rounded-md w-full p-10 items-center text-center">
            <label htmlFor="file-upload">
              <div className="flex items-center justify-center p-2 m-2 h-20 w-20 mx-auto rounded-full bg-blue-100 cursor-pointer">
                <FaFileUpload className="text-xl mx-auto" />
              </div>
            </label>

            <label
              htmlFor="file-upload"
              className="hidden md:block w-1/3 mx-auto bg-blue-500 p-2 rounded-md hover:bg-blue-400 cursor-pointer text-white transition"
            >
              Select File
            </label>
            <p className="hidden md:block text-slate-400 font-extralight text-xs m-2">
              or drag and drop CSV files here
            </p>
            <input
              id="file-upload"
              className="hidden"
              type="file"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>
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
            <div className="mt-5 text-center">
              <a
                className="bg-blue-500 hover:bg-blue-400 rounded-md p-3 text-center text-white cursor-pointer"
                href={downloadUrl}
                download={filename + ".html"}
                onClick={handleDownload}
              >
                Download Report
              </a>
            </div>
          </div>
        )}
      </div>
      {/* Logs selection section */}
      {console.log(file)}
      {file && (
        <div className="border border-black rounded-md bg-white w-2/3 mx-auto shadow-lg">
          {logs.length > 0 && (
            <>
              {/* Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pt-5 px-3 pb-6 w-full">
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

              {/* Actions */}
              <div className="border-b pt-4 px-4 pb-4 w-full text-xs bg-slate-100">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div
                    className="flex items-center gap-2 text-base sm:text-lg hover:text-blue-500 cursor-pointer"
                    onClick={() => setCheckedItems(logs)}
                  >
                    <BiSelectMultiple />
                    <h2>Select All</h2>
                  </div>

                  <div
                    className="flex items-center gap-2 text-base sm:text-lg hover:text-blue-500 cursor-pointer"
                    onClick={() => setCheckedItems([])}
                  >
                    <VscClearAll />
                    <h2>Clear All</h2>
                  </div>
                </div>
              </div>

              {/* Log list */}
              <div className="max-h-64 overflow-y-auto border-b px-4 sm:px-8 min-h-0">
                {filterdLogs.map((log) => (
                  <div key={log} className="flex gap-x-3 items-center py-1">
                    <CheckBox
                      log={log}
                      checkedItems={checkedItems}
                      handleCheckBoxChange={() => handleCheckboxChange(log)}
                    />
                    <h1 className="truncate text-sm sm:text-base">{log}</h1>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-4">
                <p
                  className="p-2 text-base sm:text-lg cursor-pointer hover:text-blue-500 hover:underline"
                  onClick={() => setFile(null)}
                >
                  Cancel
                </p>
              </div>
            </>
          )}
        </div>
      )}
      <footer className="p-5 w-full sticky bottom-0 bg-slate-100">
        <p className="text-center text-slate-400 font-extralight text-sm">
          &copy; 2024 Your Company. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
