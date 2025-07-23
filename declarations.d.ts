declare module "*.mdx" {
    import type { FC } from "react"
    import type { GetStaticPaths } from "next"
    import type { MDXComponents } from "nextra/mdx"
    const ReactComponent: FC<{ components?: MDXComponents }>
    export default ReactComponent
    export const getStaticPaths: GetStaticPaths
}

// Web Share API 类型声明
interface Navigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

// Clipboard API 类型声明
declare class ClipboardItem {
  constructor(data: Record<string, string | Blob | Promise<string | Blob>>);
}

interface Clipboard {
  write(data: ClipboardItem[]): Promise<void>;
  writeText(data: string): Promise<void>;
  read(): Promise<ClipboardItem[]>;
  readText(): Promise<string>;
}

interface Navigator {
  clipboard: Clipboard;
}
