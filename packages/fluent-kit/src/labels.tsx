import * as React from 'react';

export interface FluentLabels {
  close: string;
  loading: string;
  required: string;
  inputInvalid: string;
}

export const DEFAULT_LABELS: FluentLabels = {
  close: 'Close',
  loading: 'Loading',
  required: 'required',
  inputInvalid: 'Invalid input',
};

const FluentLabelsContext = React.createContext<FluentLabels>(DEFAULT_LABELS);
export const FluentProvider = FluentLabelsContext.Provider;

export function useFluentLabels(): FluentLabels {
  return React.useContext(FluentLabelsContext);
}
