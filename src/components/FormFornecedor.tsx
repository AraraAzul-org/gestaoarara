import { TIPOS_FORNECEDOR, type Fornecedor } from "@/lib/fornecedores";

const campo =
  "w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20";
const rotulo = "text-[11px] font-medium uppercase tracking-wide text-gray-600";
const btn =
  "rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul/40 focus-visible:ring-offset-1";

function Campo({
  nome,
  titulo,
  valor,
  obrigatorio = false,
  tipo = "texto",
}: {
  nome: string;
  titulo: string;
  valor?: string | null;
  obrigatorio?: boolean;
  tipo?: "texto" | "select" | "area";
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={rotulo}>
        {titulo}
        {obrigatorio ? " *" : ""}
      </span>
      {tipo === "select" ? (
        <select name={nome} required={obrigatorio} defaultValue={valor ?? "Serviço"} className={campo}>
          {TIPOS_FORNECEDOR.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      ) : tipo === "area" ? (
        <textarea
          name={nome}
          rows={4}
          autoComplete="off"
          defaultValue={valor ?? ""}
          className={campo}
        />
      ) : (
        <input
          name={nome}
          required={obrigatorio}
          autoComplete="off"
          defaultValue={valor ?? ""}
          className={campo}
        />
      )}
    </label>
  );
}

export function FormFornecedor({
  action,
  valores,
  id,
  rotuloBotao = "Adicionar fornecedor",
}: {
  action: (formData: FormData) => Promise<void>;
  valores?: Partial<Fornecedor>;
  id?: number;
  rotuloBotao?: string;
}) {
  return (
    <form action={action} className="mt-3">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Campo nome="nome" titulo="Nome" valor={valores?.nome} obrigatorio />
        <Campo nome="tipo" titulo="Tipo" valor={valores?.tipo} obrigatorio tipo="select" />
        <Campo nome="endereco" titulo="Endereço" valor={valores?.endereco} />
        <Campo nome="localizacao" titulo="Localização" valor={valores?.localizacao} />
        <Campo nome="telefone" titulo="Telefone" valor={valores?.telefone} />
        <Campo nome="celular" titulo="Celular" valor={valores?.celular} />
        <Campo nome="nomecontato" titulo="Nome do contato" valor={valores?.nomecontato} />
        <Campo nome="email" titulo="E-mail" valor={valores?.email} />
        <div className="md:col-span-2">
          <Campo
            nome="descricao"
            titulo="Descrição dos serviços / materiais"
            valor={valores?.descricao}
            tipo="area"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        Campos com * são obrigatórios. Informe ao menos <strong>telefone ou celular</strong>.
      </p>
      <button className={`${btn} mt-3`}>{rotuloBotao}</button>
    </form>
  );
}
