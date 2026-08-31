"use client";

import { useRef } from "react";
import { blankOutfitFormula, copyOutfitFormulaPreset, OUTFIT_FORMULA_PRESET_GROUPS, type OutfitFormula } from "@/lib/outfit-formula-library";

export function OutfitFormulaEditor({ formulas, onChange }: { formulas: OutfitFormula[]; onChange: (formulas: OutfitFormula[]) => void }) {
  const picker = useRef<HTMLDetailsElement>(null);
  const add = (formula: OutfitFormula) => {
    onChange([...formulas, formula]);
    picker.current?.removeAttribute("open");
  };
  const update = (index: number, value: Partial<OutfitFormula>) => onChange(formulas.map((formula, current) => current === index ? { ...formula, ...value } : formula));
  const move = (index: number, offset: -1 | 1) => {
    const reordered = [...formulas];
    [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
    onChange(reordered);
  };

  return (
    <fieldset className="recap-formula-editor">
      <legend>Outfit Formulas</legend>
      {formulas.map((formula, index) => (
        <div className="recap-repeat-row recap-formula-row" key={formula.id ?? index}>
          <label>Title<input maxLength={200} value={formula.title} onChange={event => update(index, { title: event.target.value })} /></label>
          <label>Equation<textarea maxLength={500} rows={2} value={formula.equation} onChange={event => update(index, { equation: event.target.value })} /></label>
          <label>Why it Works<textarea maxLength={1000} rows={3} value={formula.whyItWorks} onChange={event => update(index, { whyItWorks: event.target.value })} /></label>
          <label>Try<textarea maxLength={1000} rows={3} value={formula.try} onChange={event => update(index, { try: event.target.value })} /></label>
          <div className="recap-formula-actions">
            <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>Move Up</button>
            <button type="button" disabled={index === formulas.length - 1} onClick={() => move(index, 1)}>Move Down</button>
            <button type="button" onClick={() => onChange(formulas.filter((_, current) => current !== index))}>Remove</button>
          </div>
        </div>
      ))}
      <details className="recap-formula-picker" ref={picker}>
        <summary>Add Formula</summary>
        <div className="recap-formula-picker-panel">
          {OUTFIT_FORMULA_PRESET_GROUPS.map(group => (
            <section key={group.name} aria-labelledby={`formula-group-${group.name.replaceAll(" ", "-").toLowerCase()}`}>
              <h4 id={`formula-group-${group.name.replaceAll(" ", "-").toLowerCase()}`}>{group.name}</h4>
              <div className="recap-formula-preset-list">
                {group.formulas.map(preset => <button type="button" key={preset.title} onClick={() => add(copyOutfitFormulaPreset(preset))}>{preset.title}</button>)}
              </div>
            </section>
          ))}
          <button className="recap-formula-custom" type="button" onClick={() => add(blankOutfitFormula())}>+ Create Custom Formula</button>
        </div>
      </details>
    </fieldset>
  );
}
