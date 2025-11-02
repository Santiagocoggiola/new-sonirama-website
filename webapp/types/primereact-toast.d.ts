/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'primereact/toast' {
  import * as React from 'react';
  export const Toast: React.ComponentType<any> & {
    Portal: React.ComponentType<any>;
    Region: React.ComponentType<any>;
    Item: React.ComponentType<any>;
    Icon: React.ComponentType<any>;
    Title: React.ComponentType<any>;
    Description: React.ComponentType<any>;
    Action: React.ComponentType<any>;
    Close: React.ComponentType<any>;
  };
  export const toast: any;
}
