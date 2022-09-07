import { memo } from "react";
import { FatboyDispatch } from "./fatboyMethods";

export interface DatePickerProps {
    value: string;
    dispatch: FatboyDispatch;
}

export const DatePicker = memo(({ value, dispatch }: DatePickerProps) => {
    return (
        <div className="date-picker">
            <button onClick={() => dispatch(d => d.dayBefore())}>-1 day</button>
            <input
                type="date"
                value={value}
                onChange={e => dispatch(d => d.setEditingDate(e.target.value))}
            />
            <button onClick={() => dispatch(d => d.dayAfter())}>+1 day</button>
            <button onClick={() => dispatch(d => d.today())}>today</button>
        </div>
    );
});
