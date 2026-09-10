package bridge

import "testing"

func TestNormalizeCopyCommand(t *testing.T) {
	if got := NormalizeCopyCommand(""); got != "doctor" {
		t.Fatalf("empty should default to doctor, got %q", got)
	}
	if got := NormalizeCopyCommand("HUNT"); got != "hunt" {
		t.Fatalf("hunt normalize = %q", got)
	}
	if got := NormalizeCopyCommand("rm"); got != "help" {
		t.Fatalf("unknown should fall to help, got %q", got)
	}
}

func TestSanitizeCopyArgsDropsShellMetacharacters(t *testing.T) {
	got := sanitizeCopyArgs([]string{"--fire-only", "foo;rm", "CASHCAT"})
	if len(got) != 2 || got[0] != "--fire-only" || got[1] != "CASHCAT" {
		t.Fatalf("sanitize = %#v", got)
	}
}

func TestBuildCopyPrefersLaura(t *testing.T) {
	payload := BuildCopy(CopyOptions{Command: "rules"})
	if payload.Security.PreferredCLI != "laura" {
		t.Fatalf("preferred CLI = %q", payload.Security.PreferredCLI)
	}
	if payload.Contract != CopyContract {
		t.Fatalf("contract = %q", payload.Contract)
	}
	if payload.PluginCommand != "/run copy rules" {
		t.Fatalf("plugin command = %q", payload.PluginCommand)
	}
}
