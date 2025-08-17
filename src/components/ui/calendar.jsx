import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ru } from "date-fns/locale"
import "react-day-picker/style.css"

export function Calendar(props) {
  return (
    <DayPicker
      locale={ru}
      className="p-3" // общий padding
      classNames={{
        caption: "flex justify-center items-center py-2 font-medium",
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        nav: "flex items-center",
      }}
      {...props}
    />
  )
}