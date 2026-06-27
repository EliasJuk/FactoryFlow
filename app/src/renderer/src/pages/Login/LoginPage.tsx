import { APP } from "../../config/app"
import Button from "../../components/Button/Button"
import Card from "../../components/Card/Card"
import Input from "../../components/Input/Input"
import { useNavigate } from "react-router-dom"

function LoginPage() {
  const navigate = useNavigate();

  return (
    <main>
      <Card>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            navigate("/dashboard");
          }}
        >
          {/* Inputs */}

          <Button type="submit">
            Entrar
          </Button>

        </form>
      </Card>
    </main>
  );
}

export default LoginPage;