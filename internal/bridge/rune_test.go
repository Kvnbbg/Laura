package bridge

import "testing"

func TestNormalizeRuneCommand(t *testing.T) {
	if got := NormalizeRuneCommand("BUILD"); got != "build" {
		t.Fatalf("got %q", got)
	}
	if got := NormalizeRuneCommand("rm"); got != "status" {
		t.Fatalf("unknown should be status, got %q", got)
	}
}

func TestBuildRuneKeepsSeparateCheckout(t *testing.T) {
	p := BuildRune(RuneOptions{Command: "check"})
	if p.Vendoring != "forbidden-keep-separate-checkout" {
		t.Fatalf("vendoring = %q", p.Vendoring)
	}
	if p.PreferredCLI != "laura" {
		t.Fatalf("cli = %q", p.PreferredCLI)
	}
	if p.ToolLicense != RuneLicense {
		t.Fatalf("license = %q", p.ToolLicense)
	}
}
