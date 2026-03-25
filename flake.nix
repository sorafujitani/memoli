{
  description = "memoli - CLI markdown memo manager";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    shared.url = "github:sorafujitani/shared-flake-nix";
    shared.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    {
      self,
      nixpkgs,
      shared,
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = shared.lib.mkDevShell {
            inherit pkgs;
            name = "memoli";
            buildInputs = with pkgs; [
              bun
            ];
          };
        }
      );
    };
}
