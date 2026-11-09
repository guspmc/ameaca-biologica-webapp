import { useMemo } from 'react';
import * as QRCodeModule from 'qrcode-generator';

type CodigoQR = {
  addData: (data: string, mode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji') => void;
  make: () => void;
  createDataURL: (cellSize?: number, margin?: number) => string;
};
type FabricaQR = (typeNumber: 0, errorCorrectionLevel: 'M') => CodigoQR;

const qrcode = (QRCodeModule as unknown as { qrcode: FabricaQR }).qrcode;

type Props = { value: string; label: string };

export default function QRCodeLocal({ value, label }: Props) {
  const imagem = useMemo(() => {
    try {
      const codigo = qrcode(0, 'M');
      codigo.addData(value, 'Byte');
      codigo.make();
      return codigo.createDataURL(5, 4);
    } catch {
      return '';
    }
  }, [value]);

  return <figure className="qr-local">
    {imagem
      ? <img src={imagem} alt={'QR Code — ' + label} width={180} height={180} />
      : <p role="status">Não foi possível gerar este QR Code.</p>}
    <figcaption>{label}</figcaption>
  </figure>;
}
