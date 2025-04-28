"use client";

import { redirect, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Papa from "papaparse";
import CheckBox from "@/components/CheckBox";


export default function Home() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const fileInputRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  
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
          if (data.length ===  0 || !data[0].Collar) {
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
            (group) => parseFloat(group[0].Sample_Mass) > 0
          );

          // Extract first 'Collar' from each group
          //const logOptionsList = Object.values(groups).map((group) => group[0].Collar);
          const logOptionsList = filteredGroups.map((group) => group[0].Collar)
          setLogs(logOptionsList);
        },
      });
    };
  };

  const handleCheckboxChange = (log) => {
    setCheckedItems((prevLogs) =>
      prevLogs.includes(log)
        ? prevLogs.filter((item) => item !== log) // Remove if unchecked
        : [...prevLogs, log] // Add if checked
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);  // Correctly updates the state
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
  }

  return (
    <div className="flex flex-col gap-y-10 min-h-screen justify-center items-center mx-auto">
     
      <h1 className="m-4 text-xl font-bold">Upload File for Analysis</h1>
      <form onSubmit={handleSubmit} className="flex flex-row gap-4 items-start">
        <label htmlFor="file-upload" className="bg-blue-500 p-2 rounded-md hover:bg-blue-400 text-white transition">Select File</label>
        <input id="file-upload" className="hidden" type="file" onChange={handleFileChange} ref={fileInputRef} />
        <div className="text-sm text-gray-700">
        {
          file ? (
            <span>{file.name}</span>
          ) : (
            <span>No File Selected</span>
          )

        }
        </div>
        <button
          type="submit"
          className="bg-slate-500 text-white p-5 rounded-md hover:cursor-pointer"
        >
          Upload and Process
        </button>
      </form>
      {downloadUrl && (
        <div className="text-xl font-thin">
          <h2>Download your processed report:</h2>
          <div className="mt-5 text-center">
            <a
              className="bg-blue-500 hover:bg-blue-400 rounded-md p-3 text-center text-white cursor-pointer"
              href={downloadUrl}
              download="report.html"
              onClick={handleDownload}
            >
              Download Report
            </a>
          </div>
         
        </div>
      )}

      <div className="p-10">
              {logs.length > 0 && (
                <>
                <h2 className="text-lg">Please select the logs you want:</h2>
                {logs.map((log) => (
                  <div key={log} className="flex gap-x-3 items-center">
                    <h1>{log}</h1>
                    <CheckBox log={log} checkedItems={checkedItems} handleCheckBoxChange={() => handleCheckboxChange(log)} />
                  </div>
                ))}
                </>
              )
                }
      </div>
    </div>
  );
}
