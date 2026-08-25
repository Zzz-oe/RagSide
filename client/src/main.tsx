import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import './styles.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <KnowledgeBasePage />
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

