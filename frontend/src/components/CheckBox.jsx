import { Checkbox } from "@headlessui/react";
import { useState } from "react";

function CheckBox({ log, checkedItems, handleCheckBoxChange }) {
  return (
    <div>
      <Checkbox
        id={log}
        checked={checkedItems.includes(log)}
        onChange={() => handleCheckBoxChange(log)}  // ✅ Corrected
        className="group block size-4 rounded border bg-white data-[checked]:bg-blue-500 mt-3"
      >
        <svg
          className="stroke-white opacity-0 group-data-[checked]:opacity-100"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M3 8L6 11L11 3.5"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Checkbox>
    </div>
  );
}

export default CheckBox;
