import React from 'react';

interface A4PageProps {
  children: React.ReactNode;
  className?: string;
}

export default function A4Page({ children, className = '' }: A4PageProps) {
  const pageClassName = className ? `a4-page ${className}` : 'a4-page';

  return <section className={pageClassName}>{children}</section>;
}
