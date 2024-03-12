// EXR
export interface ExchangeRateDict {
  [date: string]: ExchangeRate[];
}
export interface ExchangeRate {
  symbol: string;
  rate: number;
}

export interface FoundValutaData {
  location: string;
  valuta: string;
  value: number;
  date: Date;
}

export interface ExchangeRateData {
  header: {
    id: string;
    test: boolean;
    prepared: string;
    sender: {
      id: string;
    };
  };
  dataSets: {
    action: string;
    validFrom: string;
    series: Record<
      string,
      {
        observations: Record<string, number[]>;
      }
    >;
  }[];
  structure: {
    links: {
      title: string;
      rel: string;
      href: string;
    }[];
    name: string;
    dimensions: {
      series: {
        id: string;
        name: string;
        values: {
          id: string;
          name: string;
        }[];
      }[];
      observation: {
        id: string;
        name: string;
        role: string;
        values: {
          id: string;
          name: string;
          start: string;
          end: string;
        }[];
      }[];
    };
  };
}
