import { APP } from "../../config/app";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-600">
            {APP.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {APP.description}
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            navigate("/dashboard");
          }}
        >
          <Input
            label="Matrícula"
            placeholder="Digite sua matrícula"
          />

          <Input
            label="Senha"
            type="password"
            placeholder="Digite sua senha"
          />

          <Button type="submit">
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Versão {APP.version}
        </p>
      </Card>
    </main>
  );
}

export default LoginPage;