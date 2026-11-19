export function InputHora24h({ id, value, onChange, required = false }) {
  function aoAlterar(event) {
    const bruto = event.target.value;
    if (bruto.length < value.length) {
      onChange(bruto.replace(/[^\d:]/g, '').slice(0, 5));
      return;
    }

    const digitos = bruto.replace(/\D/g, '').slice(0, 4);
    if (digitos.length <= 2) {
      onChange(digitos.length === 2 && bruto.endsWith(':') ? `${digitos}:` : digitos);
      return;
    }

    onChange(`${digitos.slice(0, 2)}:${digitos.slice(2)}`);
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={aoAlterar}
      placeholder="HH:MM"
      maxLength={5}
      pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
      title="Informe a hora no formato 24h (HH:MM), ex.: 19:00"
      required={required}
    />
  );
}
