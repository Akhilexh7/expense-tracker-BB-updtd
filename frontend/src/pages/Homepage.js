import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          {/* Left Content */}
          <div>
            <h1>
              Take control of your <span>finances</span>
            </h1>
            <p>
              BudgetBuddy helps you track expenses, set budgets, and understand
              your spending habits — effortlessly and securely.
            </p>

            <div className="hero-buttons">
              <button
                className="btn-primary"
                onClick={() => navigate("/signup")}
              >
                Get Started Free
              </button>

              <button
                className="btn-outline"
                onClick={() => navigate("/signin")}
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="preview">
            <div className="preview-card">
              <h3>Quick preview</h3>
              <p>
                Sample transactions, budgets, and reports — experience the clean
                simplicity of BudgetBuddy.
              </p>

              <div className="preview-box">
                <div className="transaction">
                  <span>Groceries</span>
                  <span>- $42.50</span>
                </div>

                <div className="transaction">
                  <span>Salary</span>
                  <span>+ $3,200.00</span>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>

                <p className="progress-text">
                  October spending vs budget
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Everything you need for smarter money management</h2>
        <div className="features-grid">
          {[
            "Track expenses & income",
            "Create budgets & alerts",
            "View detailed reports",
            "Your data stays private",
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">✓</div>
              <p>{f}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer>
        © {new Date().getFullYear()} BudgetBuddy — Built for peace of mind 💰
      </footer>
    </main>
  );
}
