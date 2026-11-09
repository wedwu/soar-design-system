// JSX typings for the custom elements this sample uses.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { AxColumn, AxDataTable, AxField } from '@soar-awesome/soar/components';

type CE<T, Extra = object> = DetailedHTMLProps<HTMLAttributes<T>, T> & Extra;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ax-field': CE<AxField, Partial<Pick<AxField, 'label' | 'hint' | 'value' | 'required' | 'maxlength' | 'error'>> & {
        'onax-change'?: (e: CustomEvent<{ value: string }>) => void;
      }>;
      'ax-data-table': CE<
        AxDataTable,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { columns?: AxColumn<any>[]; rows?: object[] } & Partial<Pick<AxDataTable, 'label' | 'selectable' | 'filterable' | 'loading'>>
      >;
      'wa-button': CE<HTMLElement, { type?: string; variant?: string }>;
    }
  }
}
