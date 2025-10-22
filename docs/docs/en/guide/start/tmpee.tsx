import Editor from '@monaco-editor/react';
import { defineStore, useStore } from '@vegajs/vortex';
import { useState } from 'react';
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';

const defaultCode = `
import React from "react";
import { defineStore, useStore } from "@vegajs/vortex";

const counterStore = defineStore(({ reactive }) => {
    const count = reactive(0);
    const increment = () => count.set(prev => prev + 1);
    return { count, increment };
});

export default function App() {
    const { count, increment } = useStore(counterStore);

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={increment}>Increment</button>
        </div>
    );
}
`.trim();

export default function Playground() {
  const [code, setCode] = useState(defaultCode);

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
    >
      <Editor
        height="400px"
        defaultLanguage="javascript"
        value={code}
        onChange={setCode}
        theme="vs-dark"
        options={{ fontSize: 14 }}
      />
      <LiveProvider code={code} scope={{ React, defineStore, useStore }}>
        <LiveEditor />
        <LiveError />
        <LivePreview style={{ padding: '10px', border: '1px solid #ccc' }} />
      </LiveProvider>
    </div>
  );
}
