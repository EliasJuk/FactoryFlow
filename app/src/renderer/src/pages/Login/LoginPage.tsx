import { APP } from "../../config/app";

function LoginPage() {
  return (
    <>
      <h1>{APP.name}</h1>

      <p>Versão {APP.version}</p>
    </>
  );
}

export default LoginPage;