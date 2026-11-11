import React from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  CircleUserRound,
  ChevronRight,
  GraduationCap,
  House,
  LogOut,
  Search,
  TableProperties,
  UsersRound,
} from "lucide-react";
import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LoginPage, NotFoundPage, ProfilePage, PublicHome, RegisterPage } from "./auth/AuthPages";
import { supabase } from "./lib/supabase";
import "./styles.css";

const PAGE_SIZE = 1000;
const SchoolDataContext = React.createContext(null);
const columns = [
  { key: "aluno", label: "Aluno", type: "text" },
  { key: "matricula", label: "Matrícula", type: "number" },
  { key: "materia", label: "Matéria", type: "text" },
  { key: "nota_1", label: "Nota 1", type: "number" },
  { key: "nota_2", label: "Nota 2", type: "number" },
  { key: "media", label: "Média", type: "number" },
];

async function loadRecords() {
  const allRecords = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("registro_escolar")
      .select("aluno, matricula, materia, nota_1, nota_2, media")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    allRecords.push(...data);
    if (data.length < PAGE_SIZE) return allRecords;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route element={<ProtectedRoute><SchoolDataProvider><AppShell /></SchoolDataProvider></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/alunos" element={<StudentsRoute />} />
            <Route path="/materias" element={<SubjectsRoute />} />
            <Route path="/registros" element={<AllRecordsRoute />} />
            <Route path="/registros/:id" element={<RecordDetailPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function SchoolDataProvider({ children }) {
  const { user } = useAuth();
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    if (!user) {
      setRecords([]);
      setError("");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    loadRecords()
      .then((data) => { if (active) setRecords(data); })
      .catch((loadError) => { if (active) setError(loadError.message || "Não foi possível carregar os registros."); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [user?.id]);

  return <SchoolDataContext.Provider value={{ records, loading, error }}>{children}</SchoolDataContext.Provider>;
}

function useSchoolData() {
  const context = React.useContext(SchoolDataContext);
  if (!context) throw new Error("useSchoolData deve ser usado dentro de SchoolDataProvider.");
  return context;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen label="Verificando sessão..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function LoadingScreen({ label }) {
  return <main className="route-loading"><span className="loading-spinner" /><p>{label}</p></main>;
}

function DashboardRoute() {
  return <DashboardPage {...useSchoolData()} />;
}

function StudentsRoute() {
  return <StudentsPage {...useSchoolData()} />;
}

function SubjectsRoute() {
  return <SubjectsPage {...useSchoolData()} />;
}

function AllRecordsRoute() {
  return <AllRecordsPage {...useSchoolData()} />;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { records } = useSchoolData();
  const [logoutError, setLogoutError] = React.useState("");
  const isDetail = location.pathname.startsWith("/registros/");
  const currentPage = isDetail ? { eyebrow: "REGISTRO ESCOLAR", title: "Detalhes do registro", description: "Consulta por número de matrícula." } : ({
    "/dashboard": { eyebrow: "VISÃO GERAL", title: "Registro escolar", description: "Acompanhe alunos, matérias e resultados em um só lugar." },
    "/alunos": { eyebrow: "CONSULTA POR ALUNO", title: "Desempenho dos alunos", description: "Selecione um aluno para consultar suas notas por matéria." },
    "/materias": { eyebrow: "CONSULTA POR MATÉRIA", title: "Notas por matéria", description: "Compare os resultados de cada aluno em uma matéria." },
    "/registros": { eyebrow: "BASE COMPLETA", title: "Todos os registros", description: "Consulte e pesquise todos os dados da tabela escolar." },
    "/perfil": { eyebrow: "CONTA", title: "Meu perfil", description: "Informações da sua conta e acesso à sessão." },
  }[location.pathname] || { eyebrow: "REGISTRO ESCOLAR", title: "Registro escolar", description: "" });

  async function handleSignOut() {
    setLogoutError("");
    const { error } = await signOut();
    if (error) {
      setLogoutError("Não foi possível encerrar a sessão. Tente novamente.");
      return;
    }
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/dashboard">
          <span className="brand-mark"><GraduationCap size={23} strokeWidth={2} /></span>
          <span><strong>Vértice</strong><small>PAINEL ESCOLAR</small></span>
        </Link>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <NavItem to="/dashboard" icon={<House size={18} />} label="Visão geral" end />
          <NavItem to="/alunos" icon={<UsersRound size={18} />} label="Por aluno" />
          <NavItem to="/materias" icon={<BookOpen size={18} />} label="Por matéria" />
          <NavItem to="/registros" icon={<TableProperties size={18} />} label="Tabela completa" />
        </nav>
        <NavLink className={({ isActive }) => `nav-item profile-nav${isActive ? " active" : ""}`} to="/perfil"><CircleUserRound size={18} /><span>Meu perfil</span></NavLink>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          <span className="sidebar-user">{user.email}</span>
          <span className="record-count">{records.length.toLocaleString("pt-BR")}</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Escola</span><ChevronRight size={14} /><strong>{currentPage.title}</strong></div>
          <div className="topbar-actions">
            <span className="topbar-date">PAINEL DE ACOMPANHAMENTO</span>
            <button type="button" className="header-logout" onClick={handleSignOut} title="Encerrar sessão" aria-label="Encerrar sessão"><LogOut size={16} /><span>Sair</span></button>
          </div>
        </header>
        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{currentPage.eyebrow}</p>
              <h1>{currentPage.title}</h1>
              <p className="page-description">{currentPage.description}</p>
            </div>
            <span className="heading-icon"><GraduationCap size={25} /></span>
          </div>
          {logoutError ? <ErrorNotice message={logoutError} /> : null}
          <Outlet />
        </section>
        <footer className="footer">Registro Escolar <span>·</span> Dados sincronizados com Supabase</footer>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, end = false }) {
  return (
    <NavLink className={({ isActive }) => `nav-item${isActive ? " active" : ""}`} to={to} end={end}>
      {icon}<span>{label}</span>{label === "Tabela completa" && <span className="nav-tag">ALL</span>}
    </NavLink>
  );
}

function DashboardPage({ records, loading, error }) {
  const students = uniqueValues(records, "aluno");
  const subjects = uniqueValues(records, "materia");
  const average = records.length
    ? records.reduce((sum, record) => sum + numeric(record.media), 0) / records.length
    : 0;

  return (
    <>
      <section className="summary-strip" aria-label="Resumo da tabela">
        <SummaryItem label="REGISTROS" value={loading ? "—" : records.length.toLocaleString("pt-BR")} detail="na base escolar" />
        <SummaryItem label="ALUNOS" value={loading ? "—" : students.length.toLocaleString("pt-BR")} detail="com registros" />
        <SummaryItem label="MATÉRIAS" value={loading ? "—" : subjects.length.toLocaleString("pt-BR")} detail="no acompanhamento" />
        <SummaryItem label="MÉDIA GERAL" value={loading ? "—" : formatGrade(average)} detail="entre os registros" accent />
      </section>

      <div className="section-title-row">
        <div><p className="eyebrow">ESCOLHA UMA CONSULTA</p><h2>O que você quer acompanhar?</h2></div>
        <span className="live-indicator"><span className="status-dot" />{loading ? "Sincronizando" : "Atualizado"}</span>
      </div>

      {error ? <ErrorNotice message={error} /> : null}
      <section className="destination-grid">
        <DestinationCard to="/alunos" number="01" icon={<UsersRound size={20} />} title="Desempenho dos alunos" description="Veja as notas e médias de cada aluno, organizadas por matéria." metric={`${students.length} alunos`} />
        <DestinationCard to="/materias" number="02" icon={<BookOpen size={20} />} title="Notas por matéria" description="Explore os resultados por disciplina e compare o desempenho da turma." metric={`${subjects.length} matérias`} />
        <DestinationCard to="/registros" number="03" icon={<TableProperties size={20} />} title="Tabela completa" description="Acesse todos os campos e pesquise qualquer registro escolar." metric={`${records.length.toLocaleString("pt-BR")} registros`} />
      </section>
      <section className="home-note">
        <span className="note-mark"><BookOpen size={18} /></span>
        <p><strong>Um retrato claro do progresso.</strong> Consulte os dados por aluno ou matéria e aprofunde a análise na base completa.</p>
        <Link to="/registros" aria-label="Abrir tabela completa"><ChevronRight size={18} /></Link>
      </section>
    </>
  );
}

function SummaryItem({ label, value, detail, accent = false }) {
  return <div className={`summary-item${accent ? " summary-accent" : ""}`}><span className="summary-label">{label}</span><strong>{value}</strong><span className="summary-detail">{detail}</span></div>;
}

function DestinationCard({ to, number, icon, title, description, metric }) {
  return (
    <Link className="destination-card" to={to}>
      <div className="destination-top"><span className="destination-icon">{icon}</span><span className="destination-number">{number}</span></div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="destination-bottom"><span>{metric}</span><span className="arrow-circle"><ChevronRight size={17} /></span></div>
    </Link>
  );
}

function StudentsPage({ records, loading, error }) {
  const students = uniqueValues(records, "aluno");
  const [selected, setSelected] = React.useState("");
  const currentStudent = students.includes(selected) ? selected : students[0] || "";
  const studentRecords = records.filter((record) => record.aluno === currentStudent);
  const average = studentRecords.length ? studentRecords.reduce((sum, record) => sum + numeric(record.media), 0) / studentRecords.length : 0;
  const columnsForStudent = columns.filter(({ key }) => key !== "aluno");

  return (
    <>
      <section className="filter-toolbar">
        <label className="select-control"><span>ALUNO</span><select value={currentStudent} onChange={(event) => setSelected(event.target.value)} disabled={loading || !students.length}><option value="">Selecione um aluno</option>{students.map((student) => <option key={student} value={student}>{student}</option>)}</select></label>
        <div className="toolbar-caption">{loading ? "Carregando registros..." : `${studentRecords.length} matérias encontradas`}</div>
      </section>
      {error ? <ErrorNotice message={error} /> : null}
      {!loading && currentStudent ? <section className="detail-summary"><div><span className="summary-label">ALUNO SELECIONADO</span><strong>{currentStudent}</strong></div><div><span className="summary-label">MÉDIA GERAL</span><strong className="grade-value">{formatGrade(average)}</strong></div><div><span className="summary-label">MATÉRIAS</span><strong>{studentRecords.length}</strong></div></section> : null}
      <RecordsTable records={studentRecords} columns={columnsForStudent} loading={loading} emptyText="Nenhum registro encontrado para este aluno." />
    </>
  );
}

function SubjectsPage({ records, loading, error }) {
  const subjects = uniqueValues(records, "materia");
  const [selected, setSelected] = React.useState("");
  const currentSubject = subjects.includes(selected) ? selected : subjects[0] || "";
  const subjectRecords = records.filter((record) => record.materia === currentSubject).sort((a, b) => numeric(b.media) - numeric(a.media));
  const average = subjectRecords.length ? subjectRecords.reduce((sum, record) => sum + numeric(record.media), 0) / subjectRecords.length : 0;

  return (
    <>
      <section className="filter-toolbar">
        <label className="select-control"><span>MATÉRIA</span><select value={currentSubject} onChange={(event) => setSelected(event.target.value)} disabled={loading || !subjects.length}><option value="">Selecione uma matéria</option>{subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></label>
        <div className="toolbar-caption">{loading ? "Carregando registros..." : "Ordenado pela maior média"}</div>
      </section>
      {error ? <ErrorNotice message={error} /> : null}
      {!loading && currentSubject ? <section className="detail-summary"><div><span className="summary-label">MATÉRIA</span><strong>{currentSubject}</strong></div><div><span className="summary-label">MÉDIA DA TURMA</span><strong className="grade-value">{formatGrade(average)}</strong></div><div><span className="summary-label">ALUNOS</span><strong>{subjectRecords.length}</strong></div></section> : null}
      <RecordsTable records={subjectRecords} columns={columns.filter(({ key }) => key !== "materia")} loading={loading} emptyText="Nenhum registro encontrado para esta matéria." />
    </>
  );
}

function AllRecordsPage({ records, loading, error }) {
  const [search, setSearch] = React.useState("");
  const filteredRecords = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return records;
    return records.filter((record) => columns.some(({ key }) => String(record[key] ?? "").toLocaleLowerCase("pt-BR").includes(query)));
  }, [records, search]);

  return (
    <>
      <section className="table-toolbar">
        <label className="search-box"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar aluno, matéria ou nota..." aria-label="Buscar registros" /></label>
        <span className="result-count">{loading ? "Carregando..." : `${filteredRecords.length.toLocaleString("pt-BR")} de ${records.length.toLocaleString("pt-BR")} registros`}</span>
      </section>
      {error ? <ErrorNotice message={error} /> : null}
      <RecordsTable records={filteredRecords} columns={columns} loading={loading} emptyText="Nenhum registro corresponde à busca." linkDetails />
    </>
  );
}

function RecordDetailPage() {
  const { id } = useParams();
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    const matricula = Number(id);
    if (!id || !Number.isFinite(matricula)) {
      setRecords([]);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    supabase.from("registro_escolar").select("aluno, matricula, materia, nota_1, nota_2, media")
      .eq("matricula", matricula)
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message || "Não foi possível consultar este registro.");
        setRecords(data || []);
      })
      .catch((queryError) => { if (active) setError(queryError.message || "Não foi possível consultar este registro."); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id]);

  const student = records[0];
  return (
    <>
      <Link className="back-link" to="/registros">← Voltar para todos os registros</Link>
      {student ? <section className="detail-summary record-detail-summary"><div><span className="summary-label">ALUNO</span><strong>{student.aluno}</strong></div><div><span className="summary-label">MATRÍCULA</span><strong>{student.matricula}</strong></div><div><span className="summary-label">MATÉRIAS</span><strong>{records.length}</strong></div></section> : null}
      {error ? <ErrorNotice message={error} /> : null}
      {!loading && !error && records.length === 0 ? <div className="empty-detail">Nenhum registro encontrado para a matrícula informada.</div> : null}
      <RecordsTable records={records} columns={columns} loading={loading} emptyText="Nenhum registro encontrado." />
    </>
  );
}

function RecordsTable({ records, columns: visibleColumns, loading, emptyText, linkDetails = false }) {
  const [sort, setSort] = React.useState({ key: "", direction: "asc" });
  const sortedRecords = React.useMemo(() => {
    if (!sort.key) return records;
    const column = visibleColumns.find(({ key }) => key === sort.key);
    return [...records].sort((a, b) => {
      const comparison = column?.type === "number"
        ? numeric(a[sort.key]) - numeric(b[sort.key])
        : String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), "pt-BR", { sensitivity: "base" });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [records, sort, visibleColumns]);

  function toggleSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }

  return (
    <div className="table-frame">
      <div className="table-scroll">
        <table>
          <thead><tr>{visibleColumns.map(({ key, label }) => <th key={key}><button className="sort-button" onClick={() => toggleSort(key)}>{label}{sort.key === key ? (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}</button></th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td className="table-message" colSpan={visibleColumns.length}>Carregando registros...</td></tr> : sortedRecords.length ? sortedRecords.map((record, index) => <tr key={`${record.matricula}-${record.materia}-${index}`}>{visibleColumns.map(({ key, type }) => <td key={key}>{type === "number" ? (key === "media" ? <span className="grade-pill">{formatGrade(record[key])}</span> : formatGrade(record[key])) : linkDetails && key === "aluno" ? <Link className="record-link" to={`/registros/${record.matricula}`}>{record[key] || "—"}</Link> : record[key] || "—"}</td>)}</tr>) : <tr><td className="table-message" colSpan={visibleColumns.length}>{emptyText}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer"><span><span className="status-dot" />{loading ? "Conectando à base" : "Fonte: registro_escolar"}</span><span>{loading ? "" : `${sortedRecords.length.toLocaleString("pt-BR")} linhas`}</span></div>
    </div>
  );
}

function uniqueValues(records, key) {
  return [...new Set(records.map((record) => record[key]).filter((value) => value !== null && value !== undefined && value !== ""))]
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base" }));
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatGrade(value) {
  return numeric(value).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function ErrorNotice({ message }) {
  return <div className="error-notice" role="alert"><strong>Não foi possível carregar os dados.</strong><span>{message}</span><small>Verifique as permissões de leitura da tabela no Supabase.</small></div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);