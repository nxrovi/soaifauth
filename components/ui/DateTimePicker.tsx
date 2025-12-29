'use client'

import React, { useState, useRef, useEffect } from 'react'

interface DateTimePickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
  min?: string
  max?: string
  required?: boolean
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  className = '',
  min,
  max,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  )
  const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number; period: 'AM' | 'PM' }>({
    hours: new Date().getHours() % 12 || 12,
    minutes: new Date().getMinutes(),
    period: new Date().getHours() >= 12 ? 'PM' : 'AM',
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const pickerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
        const hours = date.getHours()
        setSelectedTime({
          hours: hours % 12 || 12,
          minutes: date.getMinutes(),
          period: hours >= 12 ? 'PM' : 'AM',
        })
        // Update input value
        const dateStr = formatDate(date)
        const timeStr = formatTime(hours % 12 || 12, date.getMinutes(), hours >= 12 ? 'PM' : 'AM')
        setInputValue(`${dateStr} ${timeStr}`)
      }
    } else {
      setInputValue('')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime = (hours: number, minutes: number, period: 'AM' | 'PM'): string => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`
  }

  const parseInput = (input: string): { date: Date | null; time: { hours: number; minutes: number; period: 'AM' | 'PM' } | null } => {
    // Try to parse various formats
    // Format: YYYY-MM-DD HH:MM AM/PM
    const dateTimeMatch = input.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (dateTimeMatch) {
      const [, dateStr, hourStr, minuteStr, period] = dateTimeMatch
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        const hours = parseInt(hourStr)
        const minutes = parseInt(minuteStr)
        if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes < 60) {
          return {
            date,
            time: {
              hours,
              minutes,
              period: period.toUpperCase() as 'AM' | 'PM',
            },
          }
        }
      }
    }

    // Format: YYYY-MM-DDTHH:MM (ISO format)
    const isoMatch = input.match(/(\d{4}-\d{2}-\d{2})T?(\d{2}):(\d{2})/)
    if (isoMatch) {
      const [, dateStr, hourStr, minuteStr] = isoMatch
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        const hours24 = parseInt(hourStr)
        const minutes = parseInt(minuteStr)
        if (hours24 >= 0 && hours24 < 24 && minutes >= 0 && minutes < 60) {
          const hours = hours24 % 12 || 12
          const period = hours24 >= 12 ? 'PM' : 'AM'
          return {
            date,
            time: { hours, minutes, period },
          }
        }
      }
    }

    return { date: null, time: null }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (newValue.trim() === '') {
      onChange('')
      setSelectedDate(null)
      return
    }

    const parsed = parseInput(newValue)
    if (parsed.date && parsed.time) {
      setSelectedDate(parsed.date)
      setSelectedTime(parsed.time)
      setCurrentMonth(parsed.date)
      updateValue(parsed.date, parsed.time.hours, parsed.time.minutes, parsed.time.period)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
    updateValue(newDate, selectedTime.hours, selectedTime.minutes, selectedTime.period)
  }

  const handleTimeChange = (type: 'hours' | 'minutes' | 'period', value: number | 'AM' | 'PM') => {
    const newTime = { ...selectedTime }
    if (type === 'hours') newTime.hours = value as number
    if (type === 'minutes') newTime.minutes = value as number
    if (type === 'period') newTime.period = value as 'AM' | 'PM'
    setSelectedTime(newTime)
    if (selectedDate) {
      updateValue(selectedDate, newTime.hours, newTime.minutes, newTime.period)
    }
  }

  const updateValue = (date: Date, hours: number, minutes: number, period: 'AM' | 'PM') => {
    const h24 = period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours
    const dateStr = formatDate(date)
    const timeStr = `${String(h24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    const newValue = `${dateStr}T${timeStr}`
    onChange(newValue)
    // Update input display
    setInputValue(`${dateStr} ${formatTime(hours, minutes, period)}`)
  }

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (direction === 'next' ? 1 : -1), 1)
    )
  }

  const setToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setCurrentMonth(today)
    const hours = today.getHours()
    setSelectedTime({
      hours: hours % 12 || 12,
      minutes: today.getMinutes(),
      period: hours >= 12 ? 'PM' : 'AM',
    })
    updateValue(today, hours % 12 || 12, today.getMinutes(), hours >= 12 ? 'PM' : 'AM')
  }

  const clearValue = () => {
    setSelectedDate(null)
    onChange('')
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const prevMonthDays = Array.from({ length: firstDay }, (_, i) => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0)
    return prevMonth.getDate() - firstDay + i + 1
  })
  const nextMonthDays = Array.from({ length: 42 - (firstDay + daysInMonth) }, (_, i) => i + 1)

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold mb-2.5 text-black/90 dark:text-white/90 tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={pickerRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="YYYY-MM-DD HH:MM AM/PM"
            className={`glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
              error
                ? 'border-red-400/60 bg-red-50/60 dark:bg-red-950/40 dark:border-red-500/60'
                : ''
            } ${!inputValue ? 'text-black/35 dark:text-white/40' : 'text-black dark:text-white'}`}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-5 h-5 text-black/50 dark:text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 bottom-full mb-2 glass-card border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-scale-in w-[600px] max-w-[calc(100vw-2rem)]">
            <div className="flex">
              {/* Calendar Section */}
              <div className="flex-1 p-4 border-r border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={currentMonth.getMonth()}
                      onChange={(e) =>
                        setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))
                      }
                      className="glass-input px-3 py-1.5 rounded-lg text-sm font-semibold text-black dark:text-white border border-black/20 dark:border-white/20"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={currentMonth.getFullYear()}
                      onChange={(e) =>
                        setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))
                      }
                      className="glass-input px-3 py-1.5 rounded-lg text-sm font-semibold text-black dark:text-white border border-black/20 dark:border-white/20"
                    >
                      {Array.from({ length: 100 }, (_, i) => currentMonth.getFullYear() - 50 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-black/60 dark:text-white/60 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {prevMonthDays.map((day) => (
                    <div
                      key={`prev-${day}`}
                      className="text-center text-sm text-black/30 dark:text-white/30 py-2 rounded-lg"
                    >
                      {day}
                    </div>
                  ))}
                  {days.map((day) => {
                    const isSelected =
                      selectedDate &&
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === currentMonth.getMonth() &&
                      selectedDate.getFullYear() === currentMonth.getFullYear()
                    const isToday =
                      day === new Date().getDate() &&
                      currentMonth.getMonth() === new Date().getMonth() &&
                      currentMonth.getFullYear() === new Date().getFullYear()

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        className={`text-center text-sm font-medium py-2 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                            : isToday
                            ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-semibold'
                            : 'text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                  {nextMonthDays.map((day) => (
                    <div
                      key={`next-${day}`}
                      className="text-center text-sm text-black/30 dark:text-white/30 py-2 rounded-lg"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-2 mt-4">
                  <button
                    type="button"
                    onClick={clearValue}
                    className="flex-1 px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={setToday}
                    className="flex-1 px-3 py-2 text-sm font-medium text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Time Picker Section */}
              <div className="w-48 p-4 border-l border-black/10 dark:border-white/10">
                <div className="text-sm font-semibold text-black dark:text-white mb-3">Time</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-black/70 dark:text-white/70 mb-2 text-center">Hours</div>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => handleTimeChange('hours', hour)}
                          className={`w-full px-2 py-1.5 text-sm rounded-lg transition-all ${
                            selectedTime.hours === hour
                              ? 'bg-black dark:bg-white text-white dark:text-black font-semibold shadow-lg'
                              : 'text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {String(hour).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-black/70 dark:text-white/70 mb-2 text-center">Minutes</div>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => (
                        <button
                          key={minute}
                          type="button"
                          onClick={() => handleTimeChange('minutes', minute)}
                          className={`w-full px-2 py-1.5 text-sm rounded-lg transition-all ${
                            selectedTime.minutes === minute
                              ? 'bg-black dark:bg-white text-white dark:text-black font-semibold shadow-lg'
                              : 'text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {String(minute).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-black/70 dark:text-white/70 mb-2 text-center">Period</div>
                    <div className="space-y-1">
                      {(['AM', 'PM'] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => handleTimeChange('period', period)}
                          className={`w-full px-2 py-1.5 text-sm rounded-lg transition-all ${
                            selectedTime.period === period
                              ? 'bg-black dark:bg-white text-white dark:text-black font-semibold shadow-lg'
                              : 'text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

