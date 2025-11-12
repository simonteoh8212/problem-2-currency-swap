import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Autocomplete,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ClearIcon from "@mui/icons-material/Clear"; // ✅ for clear button
import axios from "axios";
import toast from "react-hot-toast";
import DynamicCryptoIcon from "./components/DynamicCryptoIcon";

interface RawCryptoData {
  currency: string;
  date: string;
  price: number;
}

export interface CryptoCurrency {
  code: string;
  name: string;
  priceInUSD: number;
}

const MAX_AMOUNT = 1_000_000_000_000; // 1 trillion



export default function CurrencySwapForm() {
  const [amountToSend, setAmountToSend] = useState<string>("100");
  const [fromCurrency, setFromCurrency] = useState<CryptoCurrency | null>(null);
  const [toCurrency, setToCurrency] = useState<CryptoCurrency | null>(null);
  const [amountToReceive, setAmountToReceive] = useState<string>("0.00");
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const [allCryptoCurrencies, setAllCryptoCurrencies] = useState<
    CryptoCurrency[]
  >([]);
  const [cryptoPricesInUSD, setCryptoPricesInUSD] = useState<
    Map<string, number>
  >(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [amountError, setAmountError] = useState<string>("");
  const [fromCurrencyError, setFromCurrencyError] = useState<string>("");
  const toCurrencyError = useRef<string>("");

  // Fetch crypto prices
  useEffect(() => {
    const fetchCryptoData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<RawCryptoData[]>(
          "https://interview.switcheo.com/prices.json"
        );
        const rawData = response.data;

        const pricesMap = new Map<string, number>();
        rawData.forEach((data) => {
          if (data.price > 0) pricesMap.set(data.currency, data.price);
        });

        const processed: CryptoCurrency[] = Array.from(pricesMap.entries()).map(
          ([code, price]) => ({
            code,
            name: code,
            priceInUSD: price,
          })
        );

        setAllCryptoCurrencies(processed);
        setCryptoPricesInUSD(pricesMap);

        if (processed.length > 0) {
          setFromCurrency(processed[0]);
          if (processed.length > 1) setToCurrency(processed[1]);
        }
      } catch {
        setFetchError(
          "Failed to load cryptocurrency prices. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchCryptoData();
  }, []);

  const validateForm = useCallback(() => {
    let isValid = true;
    const amount = parseFloat(amountToSend);

    // Validate amount
    if (amountToSend === "") {
      setAmountError("Amount is required.");
      isValid = false;
    } else if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a positive amount.");
      isValid = false;
    } else if (amount > MAX_AMOUNT) {
      setAmountError(`Amount cannot exceed ${MAX_AMOUNT.toLocaleString()}.`);
      isValid = false;
    } else {
      setAmountError("");
    }

    // Validate from currency
    if (!fromCurrency) {
      setFromCurrencyError('Please select a "From" currency.');
      isValid = false;
    } else {
      setFromCurrencyError("");
    }

    // Validate to currency
    if (!toCurrency) {
      toCurrencyError.current = 'Please select a "To" currency.';
      isValid = false;
    } else {
      toCurrencyError.current = "";
    }

    // Ensure currencies differ
    if (fromCurrency && toCurrency && fromCurrency.code === toCurrency.code) {
      setFromCurrencyError("Currencies cannot be the same.");
      toCurrencyError.current = "Currencies cannot be the same.";
      isValid = false;
    }

    return isValid;
  }, [amountToSend, fromCurrency, toCurrency]);

  const calculateAmountToReceive = useCallback(() => {
    const amount = parseFloat(amountToSend);
    if (
      fromCurrency &&
      toCurrency &&
      amount > 0 &&
      amount <= MAX_AMOUNT &&
      fromCurrency.code !== toCurrency.code
    ) {
      const fromPrice = cryptoPricesInUSD.get(fromCurrency.code);
      const toPrice = cryptoPricesInUSD.get(toCurrency.code);
      if (fromPrice && toPrice) {
        const rate = toPrice / fromPrice;
        setExchangeRate(rate);
        setAmountToReceive((amount * rate).toFixed(8));
      } else {
        setAmountToReceive("0.00");
        setExchangeRate(0);
      }
    } else {
      setAmountToReceive("0.00");
      setExchangeRate(0);
    }
  }, [amountToSend, fromCurrency, toCurrency, cryptoPricesInUSD]);

  useEffect(() => {
    if (!isLoading && !fetchError) calculateAmountToReceive();
  }, [calculateAmountToReceive, isLoading, fetchError]);

  useEffect(() => {
    validateForm();
  }, [amountToSend, fromCurrency, toCurrency, validateForm]);

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmountToSend(value);
    }
  };

  const handleClearAmount = () => {
    setAmountToSend("0");
    setAmountError("");
  };

  const handleFromCurrencyChange = (
    _event: SyntheticEvent,
    newValue: CryptoCurrency | null
  ) => {
    setFromCurrency(newValue);
  };

  const handleToCurrencyChange = (
    _event: SyntheticEvent,
    newValue: CryptoCurrency | null
  ) => {
    setToCurrency(newValue);
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleSwap = () => {
    if (validateForm()) {
      setIsSwapping(true);
      setTimeout(() => {
        toast.success(
          `Successfully swapped  ${amountToSend} ${fromCurrency?.code} for ${amountToReceive} ${toCurrency?.code}`
        );
        setIsSwapping(false);
      }, 2000);
    }
  };

  const isFormValid =
    !!fromCurrency &&
    !!toCurrency &&
    fromCurrency.code !== toCurrency.code &&
    parseFloat(amountToSend) > 0 &&
    parseFloat(amountToSend) <= MAX_AMOUNT &&
    !amountError &&
    !fromCurrencyError &&
    !toCurrencyError.current;

  if (isLoading)
    return (
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading cryptocurrency prices...
        </Typography>
      </Container>
    );

  if (fetchError)
    return (
      <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{fetchError}</Alert>
      </Container>
    );

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={8} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, mt: 8 }}>
        <Typography
          component="h1"
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Cryptocurrency Swap
        </Typography>

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Send
            </Typography>
            <TextField
              fullWidth
              label="Amount"
              variant="outlined"
              value={amountToSend}
              onChange={handleAmountChange}
              slotProps={{
                htmlInput: {
                  inputMode: "decimal",
                  pattern: "[0-9]*[.]?[0-9]*",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {fromCurrency && (
                        <DynamicCryptoIcon
                          code={fromCurrency.code}
                          className="mr-2"
                        />
                      )}
                      <Box component="span" className="mr-8">
                        {fromCurrency?.code || ""}
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {amountToSend && (
                        <IconButton
                          onClick={handleClearAmount}
                          edge="end"
                          size="small"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                },
              }}
              error={!!amountError}
              helperText={amountError}
            />
            <Autocomplete
              sx={{ mt: 2 }}
              options={allCryptoCurrencies}
              getOptionLabel={(option) => option.code}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              value={fromCurrency}
              onChange={handleFromCurrencyChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="From Token"
                  error={!!fromCurrencyError}
                  helperText={fromCurrencyError}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.code}>
                  <DynamicCryptoIcon code={option.code} className="mr-4" />
                  {option.code}
                </Box>
              )}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <IconButton
              onClick={handleSwapCurrencies}
              aria-label="Swap currencies"
            >
              <SwapVertIcon fontSize="large" color="primary" />
            </IconButton>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Receive
            </Typography>
            <TextField
              fullWidth
              label="Amount"
              variant="outlined"
              value={amountToReceive}
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      {toCurrency && (
                        <DynamicCryptoIcon
                          code={toCurrency.code}
                          className="mr-2"
                        />
                      )}
                      <Box component="span" className="mr-8">
                        {toCurrency?.code || ""}
                      </Box>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Autocomplete
              sx={{ mt: 2 }}
              options={allCryptoCurrencies}
              getOptionLabel={(option) => option.code}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              value={toCurrency}
              onChange={handleToCurrencyChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="To Token"
                  error={!!toCurrencyError.current}
                  helperText={toCurrencyError.current}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.code}>
                  <DynamicCryptoIcon code={option.code} className="mr-4" />
                  {option.code}
                </Box>
              )}
            />
          </Box>

          {fromCurrency &&
            toCurrency &&
            exchangeRate > 0 &&
            fromCurrency.code !== toCurrency.code && (
              <Typography variant="body2" align="center" color="text.secondary">
                1 {fromCurrency.code} = {exchangeRate.toFixed(8)}{" "}
                {toCurrency.code}
              </Typography>
            )}

          <Button
            variant="contained"
            size="large"
            onClick={handleSwap}
            disabled={!isFormValid || isSwapping}
            sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
          >
            {isSwapping ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Swap"
            )}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
