import { AppShell } from "./AppShell";
import { DocumentationPage } from "../features/documentation/DocumentationPage";
import "./App.css";

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/doc" ? <DocumentationPage /> : <AppShell />;
}
