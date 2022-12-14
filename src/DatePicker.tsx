import { memo } from "react";
import { FatboyAction } from "./reducer";

export interface DatePickerProps {
    value: string;
    dispatch: React.Dispatch<FatboyAction>;
}

export const DatePicker = memo(({ value, dispatch }: DatePickerProps) => {
    return (
        <div className="date-picker">
            <button onClick={() => dispatch({ type: "DAY_BEFORE" })}>↞</button>
            <input
                type="date"
                value={value}
                onChange={e =>
                    dispatch({
                        type: "SET_EDITING_DATE",
                        date: e.target.value,
                    })
                }
            />
            <button onClick={() => dispatch({ type: "TODAY" })}>today</button>
            <button onClick={() => dispatch({ type: "DAY_AFTER" })}>↠</button>
        </div>
    );
});
