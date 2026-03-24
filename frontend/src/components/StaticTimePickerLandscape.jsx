import * as React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import dayjs from 'dayjs';

export default function StaticTimePickerLandscape({ value, onChange, disabled = false, label = "Select Time" }) {
  // Convert time string (HH:mm) to dayjs object
  const dayjsValue = React.useMemo(() => {
    if (!value) return null;
    const [hours, minutes] = value.split(':').map(Number);
    return dayjs().hour(hours).minute(minutes);
  }, [value]);

  // Handle time change and convert back to HH:mm format
  const handleChange = (newValue) => {
    if (newValue && dayjs.isDayjs(newValue)) {
      const timeString = newValue.format('HH:mm');
      onChange(timeString);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <StaticTimePicker
          orientation="landscape"
          value={dayjsValue}
          onChange={handleChange}
          disabled={disabled}
          label={label}
          slotProps={{
            actionBar: {
              actions: [],
            },
          }}
        />
      </div>
    </LocalizationProvider>
  );
}
