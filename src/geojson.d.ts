declare module '*.geojson' {
  const value: unknown;
  export default value;
}

declare module '*.geojson?raw' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
