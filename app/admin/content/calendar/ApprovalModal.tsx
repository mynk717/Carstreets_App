// app/admin/content/calendar/ApprovalModal.tsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type ApprovalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledDate: Date | null) => void;
  contentTitle: string;
};

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contentTitle,
}) => {
  const [scheduleOption, setScheduleOption] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [minDate, setMinDate] = useState(new Date());

  useEffect(() => {
    setMinDate(new Date());
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-md p-6 w-96 max-w-full shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Approve & Schedule Content
        </h2>
        <p className="mb-4 font-medium">Content: {contentTitle}</p>

        <div className="mb-4">
          <label className="mr-4">
            <input
              type="radio"
              name="scheduleOption"
              value="now"
              checked={scheduleOption === "now"}
              onChange={() => setScheduleOption("now")}
              className="mr-2"
            />
            Publish Now
          </label>
          <label>
            <input
              type="radio"
              name="scheduleOption"
              value="later"
              checked={scheduleOption === "later"}
              onChange={() => setScheduleOption("later")}
              className="mr-2"
            />
            Schedule For Later
          </label>
        </div>

        {scheduleOption === "later" && (
          <DatePicker
            selected={scheduledDate}
           onChange={(date: Date | null) => setScheduledDate(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMMM d, yyyy h:mm aa"
            minDate={minDate}
            placeholderText="Select date and time"
            className="border rounded px-3 py-2 w-full"
          />
        )}

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (scheduleOption === "later" && !scheduledDate) {
                alert("Please select a date and time to schedule.");
                return;
              }
              onConfirm(scheduleOption === "now" ? null : scheduledDate);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
