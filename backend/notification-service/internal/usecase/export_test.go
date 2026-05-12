package usecase

import "time"

func ExportRetryDelays() []time.Duration { return retryDelays }
func SetRetryDelays(d []time.Duration)   { retryDelays = d }
